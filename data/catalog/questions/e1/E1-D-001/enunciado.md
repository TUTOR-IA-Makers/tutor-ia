Escreva um programa em C que leia um número inteiro de conta corrente com três dígitos (tal que a soma da conta com seu inverso resulte em um número de 3 dígitos) e calcule o seu dígito verificador segundo as etapas:
1. Somar o número da conta com o seu inverso (ex.: `235 + 532 = 767`).
2. Multiplicar cada dígito da soma obtida pela sua ordem posicional da esquerda para a direita (`1`, `2` e `3`) e somar os produtos (ex.: `7*1 + 6*2 + 7*3 = 40`).
3. O último dígito desse resultado (`40 % 10 = 0`) é o dígito verificador.

