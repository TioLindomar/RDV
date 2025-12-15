import { supabase } from '@/lib/customSupabaseClient';

export const tutorService = {
  // Listar todos os tutores (com paginação opcional no futuro)
  async getAll() {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Buscar um tutor específico pelo ID
  async getById(id) {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },

  // Criar novo tutor
  async create(tutorData) {
    // Pegamos o usuário atual para garantir a segurança (RLS)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from('tutors')
      .insert([{
        ...tutorData,
        veterinarian_id: user.id // Vincula ao vet logado
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar tutor
  async update(id, tutorData) {
    const { data, error } = await supabase
      .from('tutors')
      .update(tutorData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar tutor (Cuidado: vai apagar os pacientes dele por cascade)
  async delete(id) {
    const { error } = await supabase
      .from('tutors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};