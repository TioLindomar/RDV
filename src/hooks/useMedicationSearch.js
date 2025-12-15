import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useMedicationSearch = (searchTerm, category = null) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMedications = useCallback(async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setMedications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('medications')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,active_ingredient.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      setMedications(data || []);
    } catch (err) {
      console.error('Error searching medications:', err);
      setError(err.message);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchMedications();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchMedications]);

  return { medications, loading, error };
};

export const addMedication = async (medicationData) => {
  try {
    const { data, error } = await supabase
      .from('medications')
      .insert([medicationData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('Error adding medication:', err);
    return { data: null, error: err.message };
  }
};

export const getAllMedications = async (category = null) => {
  try {
    let query = supabase
      .from('medications')
      .select('*')
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('Error fetching medications:', err);
    return { data: null, error: err.message };
  }
};