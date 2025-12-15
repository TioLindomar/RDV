import { z } from 'zod';

export const tutorSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  phone: z.string().min(10, { message: "O telefone deve ser válido." }),
  email: z.string().email({ message: "O email deve ser válido." }),
  address: z.string().min(5, { message: "O endereço deve ter pelo menos 5 caracteres." }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato XXX.XXX.XXX-XX." }),
});

export const patientSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  species: z.string().min(1, { message: "A espécie é obrigatória." }),
  breed: z.string().min(2, { message: "A raça deve ter pelo menos 2 caracteres." }),
  age: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  sex: z.string().min(1, { message: "O sexo é obrigatório." }),
  microchip: z.string().optional(),
  observations: z.string().optional(),
  photo: z.string().optional(),
});

const medicationSchema = z.object({
  name: z.string().min(1, { message: "Nome do medicamento é obrigatório." }),
  dosage: z.string().min(1, { message: "Dosagem é obrigatória." }),
  frequency: z.string().min(1, { message: "Frequência é obrigatória." }),
  duration: z.string().optional().or(z.literal('')),
});

export const prescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1, { message: "Adicione pelo menos um medicamento." }),
  observations: z.string().optional().or(z.literal('')),
  date: z.string().min(1, { message: "A data é obrigatória." }),
});

export const appointmentSchema = z.object({
  tutorId: z.string().min(1, { message: "Selecione um tutor." }),
  patientId: z.string().min(1, { message: "Selecione um paciente." }),
  time: z.string().min(1, { message: "O horário é obrigatório." }),
  reason: z.string().optional(),
});