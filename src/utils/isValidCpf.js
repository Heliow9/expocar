// Função para validar o CPF
export const isValidCPF = (cpf) => {
  if (cpf.length !== 11 || /^(.)\1{10}$/.test(cpf)) return false; // Verifica se todos os números são iguais

  let sum = 0;
  let remainder;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }

  remainder = sum % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }

  remainder = sum % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[10])) return false;

  return true;
};
