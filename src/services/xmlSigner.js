import forge from 'node-forge';
import fs from 'fs';
import { create } from 'xmlbuilder2';

/**
 * Firma el XML de la factura con el certificado digital
 */
export async function signXML(xmlString, certificatePath, certificatePassword) {
  try {
    // Leer el certificado .p12
    const p12Buffer = fs.readFileSync(certificatePath, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Buffer);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);

    // Extraer clave privada y certificado
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag][0];
    const certificate = certBag.cert;

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    const privateKey = keyBag.key;

    // Crear hash SHA-256 del XML
    const md = forge.md.sha256.create();
    md.update(xmlString, 'utf8');
    const digest = md.digest().toHex();

    // Firmar el digest con la clave privada
    const signature = privateKey.sign(md);
    const signatureBase64 = forge.util.encode64(signature);

    // Obtener información del certificado
    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '');

    // Construir la estructura de firma XML (XMLDSig)
    const signedXML = addSignatureToXML(xmlString, signatureBase64, certBase64, digest);

    return signedXML;
  } catch (error) {
    console.error('❌ Error al firmar XML:', error);
    throw new Error('Error en la firma digital: ' + error.message);
  }
}

/**
 * Agrega la firma digital al XML según el estándar XMLDSig
 */
function addSignatureToXML(xmlString, signatureValue, certificate, digestValue) {
  // Parsear el XML original
  const doc = create(xmlString);
  
  // Buscar el nodo UBLExtensions
  const root = doc.first();
  const ublExtensions = root.first();
  
  // Crear el nodo de firma
  const signatureExtension = ublExtensions
    .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
        .ele('ds:Signature', {
          'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
          'Id': 'xmldsig-signature'
        })
          .ele('ds:SignedInfo')
            .ele('ds:CanonicalizationMethod', {
              Algorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
            }).up()
            .ele('ds:SignatureMethod', {
              Algorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
            }).up()
            .ele('ds:Reference', {
              URI: ''
            })
              .ele('ds:Transforms')
                .ele('ds:Transform', {
                  Algorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature'
                }).up()
              .up()
              .ele('ds:DigestMethod', {
                Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
              }).up()
              .ele('ds:DigestValue').txt(digestValue).up()
            .up()
          .up()
          .ele('ds:SignatureValue').txt(signatureValue).up()
          .ele('ds:KeyInfo')
            .ele('ds:X509Data')
              .ele('ds:X509Certificate').txt(certificate).up()
            .up()
          .up()
        .up()
      .up()
    .up();

  return doc.end({ prettyPrint: true });
}

/**
 * Valida que el XML esté bien formado
 */
export function validateXML(xmlString) {
  try {
    create(xmlString);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    };
  }
}