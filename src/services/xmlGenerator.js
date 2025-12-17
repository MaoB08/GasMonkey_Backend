import { create } from 'xmlbuilder2';
import moment from 'moment';

export function generateInvoiceXML(invoiceData) {
  const {
    company,
    customer,
    invoice,
    items,
    cufe
  } = invoiceData;
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Invoice', {
      'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
    })
    
    // UBLExtensions (firma digital va aquí)
    .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
        .ele('ext:ExtensionContent')
          .ele('DianExtensions')
            .ele('InvoiceControl')
              .ele('InvoiceAuthorization').txt(invoice.resolution_number).up()
              .ele('AuthorizationPeriod')
                .ele('cbc:StartDate').txt(invoice.valid_from).up()
                .ele('cbc:EndDate').txt(invoice.valid_to).up()
              .up()
              .ele('AuthorizedInvoices')
                .ele('Prefix').txt(invoice.prefix).up()
                .ele('From').txt(invoice.from_number).up()
                .ele('To').txt(invoice.to_number).up()
              .up()
            .up()
            .ele('InvoiceSource').txt('CO').up()
            .ele('SoftwareProvider')
              .ele('ProviderID').txt(company.nit).up()
              .ele('SoftwareID').txt(company.software_id).up()
            .up()
            .ele('SoftwareSecurityCode').txt('hash_del_software').up()
          .up()
        .up()
      .up()
    .up()
    
    // Información básica
    .ele('cbc:UBLVersionID').txt('UBL 2.1').up()
    .ele('cbc:CustomizationID').txt('10').up()
    .ele('cbc:ProfileID').txt('DIAN 2.1').up()
    .ele('cbc:ProfileExecutionID').txt('2').up() // 1=Producción, 2=Habilitación
    .ele('cbc:ID').txt(invoice.full_number).up()
    .ele('cbc:UUID', { schemeName: 'CUFE-SHA384' }).txt(cufe).up()
    .ele('cbc:IssueDate').txt(invoice.issue_date).up()
    .ele('cbc:IssueTime').txt(invoice.issue_time).up()
    .ele('cbc:InvoiceTypeCode').txt('01').up() // 01=Factura, 02=Exportación, 03=Contingencia
    .ele('cbc:DocumentCurrencyCode').txt('COP').up()
    
    // Información del emisor (vendedor)
    .ele('cac:AccountingSupplierParty')
      .ele('cbc:AdditionalAccountID').txt('1').up() // 1=Persona Jurídica, 2=Persona Natural
      .ele('cac:Party')
        .ele('cac:PartyIdentification')
          .ele('cbc:ID', { 
            schemeAgencyID: '195',
            schemeID: '31', // 31=NIT
            schemeName: '31'
          }).txt(`${company.nit}-${company.dv}`).up()
        .up()
        .ele('cac:PartyName')
          .ele('cbc:Name').txt(company.business_name).up()
        .up()
        .ele('cac:PhysicalLocation')
          .ele('cac:Address')
            .ele('cbc:ID').txt('498'). up() // Código DANE ciudad
            .ele('cbc:CityName').txt(company.city).up()
            .ele('cbc:CountrySubentity').txt(company.department).up()
            .ele('cbc:CountrySubentityCode').txt('54').up() // Código DANE departamento
            .ele('cac:AddressLine')
              .ele('cbc:Line').txt(company.address).up()
            .up()
            .ele('cac:Country')
              .ele('cbc:IdentificationCode').txt('CO').up()
              .ele('cbc:Name').txt('Colombia').up()
            .up()
          .up()
        .up()
        .ele('cac:PartyTaxScheme')
          .ele('cbc:RegistrationName').txt(company.business_name).up()
          .ele('cbc:CompanyID', { 
            schemeAgencyID: '195',
            schemeID: '31',
            schemeName: '31'
          }).txt(`${company.nit}-${company.dv}`).up()
          .ele('cbc:TaxLevelCode').txt('O-13').up() // Código responsabilidad fiscal
          .ele('cac:TaxScheme')
            .ele('cbc:ID').txt('01').up()
            .ele('cbc:Name').txt('IVA').up()
          .up()
        .up()
        .ele('cac:PartyLegalEntity')
          .ele('cbc:RegistrationName').txt(company.business_name).up()
          .ele('cbc:CompanyID', {
            schemeAgencyID: '195',
            schemeID: '31',
            schemeName: '31'
          }).txt(`${company.nit}-${company.dv}`).up()
        .up()
        .ele('cac:Contact')
          .ele('cbc:Telephone').txt(company.phone).up()
          .ele('cbc:ElectronicMail').txt(company.email).up()
        .up()
      .up()
    .up();
    
  // ... (continúa con cliente, items, totales)
  
  return doc.end({ prettyPrint: true });
}