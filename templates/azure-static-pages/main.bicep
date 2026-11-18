// Personal project, not for production, provided as is; not affiliated with the author's employer or Microsoft.
// Deploys an Azure Static Web Apps Free-tier site ($0/month) for private-repo web pages when GitHub Pro+ is not available (ADR 0026).

targetScope = 'resourceGroup'

@description('Name of the Azure Static Web App.')
param name string = 'swa-avd-ops-private'

@description('Azure region for the Static Web App (Free tier is available in centralus, eastus2, westeurope, westus2, eastasia).')
@allowed([
  'centralus'
  'eastus2'
  'westeurope'
  'westus2'
  'eastasia'
])
param location string = 'centralus'

resource staticSite 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output staticSiteId string = staticSite.id
output defaultHostname string = staticSite.properties.defaultHostname
