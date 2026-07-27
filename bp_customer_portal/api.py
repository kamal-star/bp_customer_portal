"""Mobile API for the BP Great North customer fuel-order app.

This app is a thin, mobile-friendly layer over the EXISTING `greatnorth` fuel
endpoints. It adds the two things the web portal (/fuel_orders) does not expose
as JSON — token login and a list endpoint — and wraps create/update/cancel so the
phone talks to one clean, customer-scoped namespace.

Underlying doctype: `SO Request` (naming series FT…). Orders are scoped to the
Customer linked to the logged-in user through the Customer `portal_users` table —
exactly like the web portal.

Namespace: /api/method/bp_customer_portal.api.<name>
    app_login          (allow_guest) -> authenticate + API token + customer
    get_profile                       -> resolve current user's customer
    get_form_options                  -> fuel products + stations for the form
    get_fuel_orders                   -> list the customer's SO Requests (search/filter)
    get_fuel_order                    -> one order (full fields incl. status/OTP)
    create_fuel_order                 -> delegates to greatnorth create
    update_fuel_order                 -> ownership check + delegates to greatnorth update
    cancel_fuel_order                 -> ownership check + delegates to greatnorth delete
"""

import frappe
from frappe import _
from frappe.auth import LoginManager

# The existing business logic lives in the greatnorth app. We reuse it so the app
# behaves identically to the web portal (SO naming, side effects, etc.).
from greatnorth.api import fuel as gn_fuel

DOCTYPE = "SO Request"
VALID_STATUS = ("Received", "Served", "Cancelled")

# Fuel products shown in the form (matches the web portal's fixed options).
FUEL_PRODUCTS = [
    {"value": "D001", "label": "Diesel"},
    {"value": "P002", "label": "Petrol"},
]


# ---------------------------------------------------------------------------
# Customer resolution (same mechanism as the web portal)
# ---------------------------------------------------------------------------

def get_customer_for_user(user=None):
    """Return the Customer name linked to `user` via portal_users, else None."""
    user = user or frappe.session.user
    if not user or user == "Guest":
        return None
    rows = frappe.get_all(
        "Portal User",
        filters={"user": user, "parenttype": "Customer"},
        fields=["parent"],
        limit=1,
    )
    return rows[0].parent if rows else None


def _require_customer():
    customer = get_customer_for_user()
    if not customer:
        frappe.throw(
            _("Your login is not linked to any customer. Please contact BP Great North."),
            frappe.PermissionError,
        )
    return customer


def _assert_owns(name, customer):
    owner = frappe.db.get_value(DOCTYPE, name, "customer")
    if owner != customer:
        frappe.throw(_("You are not allowed to access this order."), frappe.PermissionError)


def _ensure_api_keys(user):
    """Return (api_key, api_secret), generating them once and reusing thereafter."""
    user_doc = frappe.get_doc("User", user)
    if not user_doc.api_key:
        user_doc.api_key = frappe.generate_hash(length=15)
        user_doc.save(ignore_permissions=True)
    api_secret = user_doc.get_password("api_secret") if user_doc.api_key else None
    if not api_secret:
        api_secret = frappe.generate_hash(length=15)
        user_doc.api_secret = api_secret
        user_doc.save(ignore_permissions=True)
    return user_doc.api_key, api_secret


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def app_login(usr, pwd):
    """Authenticate a portal user, return an API token + their customer."""
    login_manager = LoginManager()
    login_manager.authenticate(usr, pwd)      # raises on bad credentials
    login_manager.post_login()

    user = login_manager.user
    customer = get_customer_for_user(user)
    if not customer:
        frappe.throw(
            _("This account is not linked to a customer. Please contact BP Great North."),
            frappe.PermissionError,
        )

    api_key, api_secret = _ensure_api_keys(user)
    return {
        "user": user,
        "full_name": frappe.db.get_value("User", user, "full_name"),
        "customer": customer,
        "customer_name": frappe.db.get_value("Customer", customer, "customer_name") or customer,
        "api_key": api_key,
        "api_secret": api_secret,
    }


@frappe.whitelist()
def get_profile():
    customer = _require_customer()
    return {
        "user": frappe.session.user,
        "full_name": frappe.db.get_value("User", frappe.session.user, "full_name"),
        "customer": customer,
        "customer_name": frappe.db.get_value("Customer", customer, "customer_name") or customer,
    }


@frappe.whitelist()
def get_form_options():
    """Fuel products + stations for the create/edit form."""
    _require_customer()
    stations = frappe.get_all(
        "Warehouse",
        filters={"is_group": 0, "disabled": 0, "name": ["like", "%- GNSS"]},
        fields=["name"],
        order_by="name asc",
    )
    station_values = [w.name for w in stations]
    if not station_values:
        # Fallback to any non-group warehouse if the naming pattern differs.
        station_values = [
            w.name
            for w in frappe.get_all(
                "Warehouse", filters={"is_group": 0, "disabled": 0}, fields=["name"], order_by="name asc"
            )
        ]
    return {"products": FUEL_PRODUCTS, "stations": station_values}


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_fuel_orders(search=None, status=None, start=0, page_length=50):
    """List the current customer's fuel orders (newest first)."""
    customer = _require_customer()

    filters = {"customer": customer}
    if status and status in VALID_STATUS:
        filters["status"] = status

    or_filters = None
    if search:
        like = f"%{search}%"
        or_filters = {
            "name": ["like", like],
            "vehicle": ["like", like],
            "driver_name": ["like", like],
            "customer_po_no": ["like", like],
        }

    return frappe.get_all(
        DOCTYPE,
        filters=filters,
        or_filters=or_filters,
        fields=[
            "name", "date", "status", "item", "qty", "station", "vehicle",
            "driver_name", "driver_mobile_number", "customer_po_no", "otp", "remarks",
        ],
        order_by="modified desc",
        start=int(start),
        page_length=int(page_length),
    )


@frappe.whitelist()
def get_fuel_order(name):
    """One fuel order with all customer-facing fields."""
    customer = _require_customer()
    doc = frappe.get_doc(DOCTYPE, name)
    if doc.customer != customer:
        frappe.throw(_("You are not allowed to view this order."), frappe.PermissionError)

    editable = doc.status != "Cancelled"
    return {
        "name": doc.name,
        "status": doc.status,
        "item": doc.item,
        "qty": doc.qty,
        "date": str(doc.date) if doc.date else None,
        "customer_po_no": doc.customer_po_no,
        "customer_po_date": str(doc.customer_po_date) if doc.customer_po_date else None,
        "station": doc.station,
        "vehicle": doc.vehicle,
        "driver_name": doc.driver_name,
        "driver_mobile_number": doc.driver_mobile_number,
        "remarks": doc.remarks,
        "otp": doc.otp,
        "sales_order": doc.sales_order,
        "sales_invoice": doc.sales_invoice,
        "editable": editable,
        "cancellable": editable,
    }


# ---------------------------------------------------------------------------
# Write — delegate to greatnorth so behaviour matches the web portal exactly
# ---------------------------------------------------------------------------

def _payload(item, qty, delivery_date, customer_po_no, customer_po_date,
             station, vehicle, driver_name, driver_mobile_number, remarks):
    return {
        "item": item,
        "qty": qty,
        "delivery_date": delivery_date,
        "customer_po_no": customer_po_no,
        "customer_po_date": customer_po_date,
        "station": station,
        "vehicle": vehicle,
        "driver_name": driver_name,
        "driver_mobile_number": driver_mobile_number,
        "remarks": remarks,
    }


@frappe.whitelist()
def create_fuel_order(item, qty, delivery_date=None, customer_po_no=None,
                      customer_po_date=None, station=None, vehicle=None,
                      driver_name=None, driver_mobile_number=None, remarks=None):
    _require_customer()
    data = _payload(item, qty, delivery_date, customer_po_no, customer_po_date,
                    station, vehicle, driver_name, driver_mobile_number, remarks)
    # greatnorth expects `data` (JSON string works whether it uses json.loads or parse_json).
    return gn_fuel.create_fuel_order(data=frappe.as_json(data))


@frappe.whitelist()
def update_fuel_order(name, item=None, qty=None, delivery_date=None, customer_po_no=None,
                      customer_po_date=None, station=None, vehicle=None,
                      driver_name=None, driver_mobile_number=None, remarks=None):
    customer = _require_customer()
    _assert_owns(name, customer)
    fields = _payload(item, qty, delivery_date, customer_po_no, customer_po_date,
                      station, vehicle, driver_name, driver_mobile_number, remarks)
    return gn_fuel.update_fuel_order(name=name, **fields)


@frappe.whitelist()
def cancel_fuel_order(name):
    customer = _require_customer()
    _assert_owns(name, customer)
    return gn_fuel.delete_fuel_order(name=name)
