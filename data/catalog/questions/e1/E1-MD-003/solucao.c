#include <stdio.h>

int main(void) {
    int d1, h1, m1, s1, d2, h2, m2, s2;
    int inicio, fim, duracao, dias, horas, minutos, segundos;
    scanf("Dia %d", &d1);
    scanf("%d : %d : %d", &h1, &m1, &s1);
    scanf(" Dia %d", &d2);
    scanf("%d : %d : %d", &h2, &m2, &s2);
    inicio = d1 * 86400 + h1 * 3600 + m1 * 60 + s1;
    fim = d2 * 86400 + h2 * 3600 + m2 * 60 + s2;
    duracao = fim - inicio;
    dias = duracao / 86400;
    duracao %= 86400;
    horas = duracao / 3600;
    duracao %= 3600;
    minutos = duracao / 60;
    segundos = duracao % 60;
    printf("%d dia(s)\n%d hora(s)\n%d minuto(s)\n%d segundo(s)\n", dias, horas, minutos, segundos);
    return 0;
}
