import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CreditCard, Star, CheckCircle, Copy, XCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

const CheckoutForm = ({ plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    toast({
      title: '🚧 Pagamento não implementado!',
      description: "Esta é uma demonstração. Nenhuma cobrança será feita.",
    });

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }
    setLoading(false);
  };
  
  const handlePixPayment = () => {
    const pixCode = '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540529.905802BR5913NOME DO VET6009SAO PAULO62070503***6304E2D3';
    navigator.clipboard.writeText(pixCode);
    toast({
        title: "Código Pix Copiado!",
        description: "Use o código no seu app de pagamentos para concluir a assinatura.",
    });
  }

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#FFFFFF',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="card-element" className="text-foreground mb-2 block">Dados do Cartão de Crédito</Label>
        <div className="p-3 rounded-md border border-border bg-input">
           <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      
      <Button disabled={loading || !stripe} type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold">
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? `Processando...` : `Pagar R$${plan.price}/mês`}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Ou pague com Pix</span>
        </div>
      </div>
      
      <Button variant="outline" type="button" onClick={handlePixPayment} className="w-full bg-transparent border-secondary text-secondary hover:bg-secondary/10">
        <Copy className="w-4 h-4 mr-2" />
        Copiar Código Pix
      </Button>
    </form>
  );
};


const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      name: 'Plano Gratuito',
      price: '0,00',
      features: [
        'Emissão de receitas limitadas (10/mês)',
        'Cadastro de tutores e pacientes limitado (10 cada)',
        'Assinatura digital Gov.br',
      ],
      negativeFeatures: [
        'Com anúncios',
        'Suporte básico',
      ],
      isPopular: false,
    },
    {
      name: 'Plano PRO',
      price: '29,90',
      features: [
        'Emissão de receitas ilimitadas',
        'Cadastro de tutores e pacientes ilimitado',
        'Assinatura digital Gov.br',
        'Agenda de consultas',
        'Suporte prioritário',
        'Sem anúncios',
      ],
      isPopular: true,
    },
  ];
  
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    toast({
        title: "Plano Selecionado!",
        description: `Você escolheu o ${plan.name}.`,
    });
    if (plan.price === '0,00') {
      // Simulate successful selection for free plan
      toast({
        title: "Plano Gratuito Ativado!",
        description: "Você já pode usar o plano gratuito com anúncios.",
      });
      navigate('/dashboard'); // Or some confirmation page
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex items-center space-x-4 mb-8"
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="bg-transparent border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Gerenciar Assinatura</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para você e comece a usar todos os recursos.</p>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 items-start">
            {plans.map((plan, index) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                  <Card className={`glass-effect border-border ${selectedPlan?.name === plan.name ? 'border-primary' : ''} h-full flex flex-col`}>
                      <CardHeader>
                          <div className="flex justify-between items-center">
                              <CardTitle className="text-2xl">{plan.name}</CardTitle>
                              {plan.isPopular && (
                                  <div className="flex items-center text-xs bg-accent text-white px-3 py-1 rounded-full">
                                      <Star className="w-3 h-3 mr-1" /> Mais Popular
                                  </div>
                              )}
                          </div>
                          <CardDescription>
                              <span className="text-4xl font-bold text-foreground">R${plan.price}</span>
                              <span className="text-muted-foreground">/mês</span>
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-grow">
                          <ul className="space-y-2 text-muted-foreground">
                              {plan.features.map(feature => (
                                  <li key={feature} className="flex items-center">
                                      <CheckCircle className="w-4 h-4 mr-2 text-secondary" />
                                      {feature}
                                  </li>
                              ))}
                              {plan.negativeFeatures && plan.negativeFeatures.map(feature => (
                                  <li key={feature} className="flex items-center text-destructive">
                                      <XCircle className="w-4 h-4 mr-2" />
                                      {feature}
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                      <CardFooter>
                          <Button 
                              onClick={() => handleSelectPlan(plan)} 
                              className="w-full bg-gradient-to-r from-secondary to-green-400 hover:from-secondary/90 hover:to-green-500 text-white font-semibold"
                              disabled={selectedPlan?.name === plan.name}
                          >
                              {selectedPlan?.name === plan.name ? 'Plano Selecionado' : 'Selecionar Plano'}
                          </Button>
                      </CardFooter>
                  </Card>
              </motion.div>
            ))}

            {selectedPlan && selectedPlan.price !== '0,00' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 lg:col-span-1 lg:col-start-2" // Occupy full width if only one plan selected
              >
                  <Card className="glass-effect border-border">
                      <CardHeader>
                          <CardTitle>Pagamento</CardTitle>
                          <CardDescription>Insira seus dados de pagamento para o {selectedPlan.name}.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Elements stripe={stripePromise}>
                              <CheckoutForm plan={selectedPlan} />
                          </Elements>
                      </CardContent>
                  </Card>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;