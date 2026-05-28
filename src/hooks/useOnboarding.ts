import { useState, useEffect } from 'react';

export const useOnboarding = (launchCount: number) => {
  const [step, setStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('fpi_onboarding_op_completed');
    // Só ativa se nunca foi completado e não tem lançamentos (usuário novo real)
    if (!completed && launchCount === 0) {
      setIsActive(true);
      setStep(1);
    }
  }, [launchCount]);

  const nextStep = () => {
    if (step < 3) {
      setStep(s => s + 1);
    }
  };

  const skip = () => {
    setIsActive(false);
    setStep(0);
    localStorage.setItem('fpi_onboarding_op_completed', 'true');
  };

  const finish = () => {
    setIsActive(false);
    setStep(0);
    localStorage.setItem('fpi_onboarding_op_completed', 'true');
  };

  return {
    step,
    isActive,
    nextStep,
    skip,
    finish,
  };
};
