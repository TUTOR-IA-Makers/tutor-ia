#include <stdio.h>

int main(void) {
    int tempo, velocidade;
    double litros;
    scanf("%d %d", &tempo, &velocidade);
    litros = (tempo * velocidade) / 12.0;
    printf("%.3f\n", litros);
    return 0;
}
