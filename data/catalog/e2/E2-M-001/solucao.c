#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    double nota, maior, menor, soma;
    scanf("%lf", &nota);
    maior = menor = soma = nota;
    for (int i = 1; i < n; i++) {
        scanf("%lf", &nota);
        soma += nota;
        if (nota > maior) maior = nota;
        if (nota < menor) menor = nota;
    }
    printf("%.2f\n%.2f\n%.2f\n", maior, menor, soma/n);
    return 0;
}
