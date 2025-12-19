import { supabase } from '@/lib/customSupabaseClient';

export const prescriptionService = {
  // Criar prescrição (Vinculada à Organização)
  async create(prescriptionData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Pega a Org ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error("Erro de permissão.");

    // 2. Cria a prescrição
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{
        organization_id: profile.organization_id, // Chave do SaaS
        veterinarian_id: prescriptionData.veterinarianId,
        patient_id: prescriptionData.patientId,
        medications: prescriptionData.medications, 
        purpose: prescriptionData.purpose,
        document_body: prescriptionData.attestationText || null,
        type: prescriptionData.type,
        unique_code: crypto.randomUUID(),
        status: 'issued'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar por ID (Interno)
  async getById(id) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients(*),
        veterinarian:profiles(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar por Código Único (Público - QRCode)
  async getByUniqueCode(code) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients(name, species, breed, weight, birth_date, tutor_id),
        veterinarian:profiles(name, crmv, crmv_uf, clinic_name, phone, address, number, city, state)
      `)
      .eq('unique_code', code)
      .single();

    if (error) throw error;
    
    // Buscar tutor separado (pois está ligado ao paciente)
    if (data && data.patient) {
        const { data: tutorData } = await supabase
            .from('tutors')
            .select('name, cpf')
            .eq('id', data.patient.tutor_id)
            .single();
        data.tutor = tutorData;
    }

    return data;
  },

  // Listar todas as prescrições com filtros e dados relacionados
  async getAll(filters = {}) {
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients(name, species, tutor:tutors(name))
      `)
      .order('created_at', { ascending: false });

    // Filtro de Texto (Busca por nome do paciente, tutor ou código)
    if (filters.search) {
      // Nota: Supabase não faz "OR" entre tabelas relacionadas facilmente via API simples.
      // Vamos filtrar pelo que temos acesso direto ou pós-processar se necessário.
      // Aqui vamos focar no Código Único e ID, e no front filtramos nomes se a lista for pequena ( < 1000 itens)
      // OU usamos uma View SQL no futuro. Para V1, vamos carregar e filtrar no front ou buscar por codigo.
    }

    // Filtro por Tipo (Receita vs Atestado)
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    // Filtro por Data (Opcional, pode ser adicionado depois)
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  },
};