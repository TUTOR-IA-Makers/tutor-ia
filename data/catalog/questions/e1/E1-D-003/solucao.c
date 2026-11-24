#include <stdio.h>

int main(void) {
    int n, horas, minutos, segundos;
    scanf("%d", &n);
    horas = n / 3600;
    minutos = (n % 3600) / 60;
    segundos = n % 60;
    printf("%d:%d:%d\n", horas, minutos, segundos);
    return 0;
}
