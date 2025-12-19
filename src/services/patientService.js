import { supabase } from '@/lib/customSupabaseClient';

export const patientService = {
  // Listar pacientes de um tutor
  async getByTutorId(tutorId) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Criar paciente (Vinculado à Organização)
  async create(patientData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // 1. Pega a Org ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error("Erro de permissão.");

    // 2. Cria com Org ID
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        ...patientData,
        organization_id: profile.organization_id, // Chave do SaaS
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, patientData) {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};