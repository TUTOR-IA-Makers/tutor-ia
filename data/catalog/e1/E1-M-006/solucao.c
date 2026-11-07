#include <stdio.h>

int main(void) {
    int notas, moedas;
    scanf("%d %d", &notas, &moedas);
    printf("%.2f\n", notas * 50.0 + moedas * 0.25);
    return 0;
}
