import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Estilos do PDF (Parecido com CSS, mas para impressão)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#333',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLeft: { maxWidth: '70%' },
  headerRight: { maxWidth: '30%', textAlign: 'right' },
  clinicName: { fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  vetName: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  vetInfo: { fontSize: 9, color: '#555' },
  
  docInfo: { fontSize: 9, color: '#888' },
  docId: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

  section: { marginVertical: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 4 },
  sectionTitle: { fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  
  patientName: { fontSize: 14, fontWeight: 'bold' },
  infoText: { fontSize: 10, color: '#444' },

  title: { fontSize: 18, textAlign: 'center', marginVertical: 20, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },

  medicationContainer: { marginBottom: 15, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: '#ccc' },
  medName: { fontSize: 12, fontWeight: 'bold' },
  medDetails: { fontSize: 11, marginBottom: 2 },
  medInstructions: { fontSize: 11, fontStyle: 'italic', color: '#444' },

  attestationBody: { fontSize: 12, textAlign: 'justify', lineHeight: 1.8, padding: 10 },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  signatureArea: { textAlign: 'center', flex: 1 },
  signatureImage: { width: 150, height: 50, alignSelf: 'center' }, // Se tivesse imagem de assinatura
  qrCode: { width: 60, height: 60 },
  footerText: { fontSize: 8, color: '#999', textAlign: 'right', maxWidth: 150 },
  
  signedBadge: {
    fontSize: 9, 
    color: 'green', 
    borderWidth: 1, 
    borderColor: 'green', 
    padding: 4, 
    borderRadius: 4, 
    alignSelf: 'center',
    marginBottom: 5
  }
});

// Componente do Documento PDF
const PrescriptionDocument = ({ data, qrCodeUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.vetName}>Dr(a). {data.veterinarian.name}</Text>
          <Text style={styles.clinicName}>{data.veterinarian.clinic_name}</Text>
          <Text style={styles.vetInfo}>{data.veterinarian.crmv} • {data.veterinarian.phone}</Text>
          {data.veterinarian.address && (
            <Text style={styles.vetInfo}>
              {data.veterinarian.address}, {data.veterinarian.number} - {data.veterinarian.city}/{data.veterinarian.state}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docInfo}>EMISSÃO</Text>
          <Text style={styles.docInfo}>{new Date(data.created_at || new Date()).toLocaleDateString('pt-BR')}</Text>
          <Text style={styles.docId}>{data.unique_code?.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      {/* Dados do Paciente e Tutor */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Paciente</Text>
            <Text style={styles.patientName}>{data.patient.name}</Text>
            <Text style={styles.infoText}>
              {data.patient.species} • {data.patient.breed} • {data.patient.age ? data.patient.age + ' anos' : ''} • {data.patient.weight ? data.patient.weight + 'kg' : ''}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Responsável</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.tutor.name}</Text>
            <Text style={styles.infoText}>CPF: {data.tutor.cpf || 'Não informado'}</Text>
          </View>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title}>
        {data.type === 'attestation' ? 'Atestado Médico Veterinário' : 'Receituário'}
      </Text>

      {/* Corpo do Documento */}
      <View style={{ flex: 1 }}>
        {data.type === 'attestation' ? (
          <Text style={styles.attestationBody}>
            {data.attestationText || data.document_body}
          </Text>
        ) : (
          <View>
            {data.medications?.map((med, index) => (
              <View key={index} style={styles.medicationContainer}>
                <Text style={styles.medName}>
                  {index + 1}. {med.name}
                </Text>
                <Text style={styles.medDetails}>
                  Uso: {med.dosage}
                </Text>
                <Text style={styles.medInstructions}>
                  {med.frequency} {med.duration && `• Duração: ${med.duration}`}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {data.purpose && (
           <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
             <Text style={{ fontSize: 10, color: '#666' }}>Indicação/Diagnóstico: {data.purpose}</Text>
           </View>
        )}
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <View style={{ width: 60 }}>
           {/* Espaço vazio para equilíbrio */}
        </View>

        <View style={styles.signatureArea}>
          {data.status === 'signed' ? (
             <Text style={styles.signedBadge}>ASSINADO ELETRONICAMENTE</Text>
          ) : (
             <View style={{ height: 40 }} /> // Espaço para carimbo
          )}
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Dr(a). {data.veterinarian.name}</Text>
          <Text style={{ fontSize: 10, color: '#555' }}>{data.veterinarian.crmv}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrCode} />}
          <Text style={styles.footerText}>Verifique a autenticidade deste documento via QR Code.</Text>
          <Text style={styles.footerText}>RDV System</Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default PrescriptionDocument;