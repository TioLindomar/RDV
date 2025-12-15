import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Plus, AlertCircle, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useMedicationSearch } from '@/hooks/useMedicationSearch';
import { cn } from '@/lib/utils';

export const MedicationSearch = ({ value, onChange, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { medications, loading, error } = useMedicationSearch(searchTerm, selectedCategory);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectMedication = (medication) => {
    const medicationText = `${medication.name} - ${medication.active_ingredient || 'N/A'}`;
    onChange(medicationText);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Button
            type="button"
            size="sm"
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'text-xs',
              selectedCategory === null
                ? 'bg-gradient-to-r from-primary to-blue-500 text-white'
                : 'bg-transparent border-border text-foreground hover:bg-muted'
            )}
          >
            Todos
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectedCategory === 'veterinary' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('veterinary')}
            className={cn(
              'text-xs',
              selectedCategory === 'veterinary'
                ? 'bg-gradient-to-r from-secondary to-green-500 text-white'
                : 'bg-transparent border-border text-foreground hover:bg-muted'
            )}
          >
            Veterinário
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectedCategory === 'human' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('human')}
            className={cn(
              'text-xs',
              selectedCategory === 'human'
                ? 'bg-gradient-to-r from-accent to-purple-500 text-white'
                : 'bg-transparent border-border text-foreground hover:bg-muted'
            )}
          >
            Humano
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={value || searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Digite para buscar medicamento..."
            className="pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (searchTerm.length >= 2 || medications.length > 0) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {error && (
              <div className="p-4 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Erro ao buscar medicamentos</span>
              </div>
            )}

            {!error && loading && (
              <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Buscando medicamentos...</span>
              </div>
            )}

            {!error && !loading && medications.length === 0 && searchTerm.length >= 2 && (
              <div className="p-4 text-center text-muted-foreground">
                <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum medicamento encontrado</p>
                <p className="text-xs mt-1">Tente buscar por outro nome ou princípio ativo</p>
              </div>
            )}

            {!error && !loading && medications.length > 0 && (
              <div className="py-2">
                {medications.map((medication) => (
                  <motion.button
                    key={medication.id}
                    type="button"
                    onClick={() => handleSelectMedication(medication)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 border-b border-border last:border-b-0"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{medication.name}</p>
                        {medication.active_ingredient && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Princípio ativo: {medication.active_ingredient}
                          </p>
                        )}
                        {medication.presentation && (
                          <p className="text-xs text-muted-foreground">
                            {medication.presentation}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap',
                          medication.category === 'veterinary'
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-accent/20 text-accent'
                        )}
                      >
                        {medication.category === 'veterinary' ? 'Veterinário' : 'Humano'}
                      </span>
                    </div>
                    {medication.registry_number && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Registro: {medication.registry_number}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};