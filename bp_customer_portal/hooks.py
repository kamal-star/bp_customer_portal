app_name = "bp_customer_portal"
app_title = "BP Customer Portal (Mobile API)"
app_publisher = "BP Great North"
app_description = "Mobile API layer over the greatnorth fuel-order endpoints for the customer app"
app_email = "support@bpgreatnorth.com"
app_license = "MIT"

# Requires the `greatnorth` app to be installed on the same site (this app reuses
# greatnorth.api.fuel for create/update/cancel).
required_apps = ["greatnorth"]

# Endpoints are exposed automatically via
# /api/method/bp_customer_portal.api.<function>. No extra hooks required.
