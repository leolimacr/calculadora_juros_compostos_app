import React from 'react';
import GoalManager from '../components/tools/goals/GoalManager';
// Importe o hook de autenticação que você usa no projeto
// Exemplos:
// import { useAuth } from '../contexts/AuthContext';
// import { useUser } from '../contexts/UserContext';
// Ajuste conforme sua implementação

const MetasPage: React.FC = () => {
  // Obtenha o usuário autenticado
  // const { user } = useAuth(); // Exemplo com useAuth
  // Se você não tiver um contexto global, pode passar via props da rota, mas o ideal é usar um contexto

  // Como alternativa temporária, se o userMeta vier de outro lugar, você pode precisar ajustar.
  // Vou assumir que você tem um hook useAuth que retorna o usuário:
  const { user } = useAuth(); // <-- Substitua pelo seu hook real

  return <GoalManager userMeta={user} />;
};

export default MetasPage;