#include <stdio.h>

int main(void) {
    int n, count = 0, maior, menor;
    double soma = 0;
    while (scanf("%d", &n) == 1) {
        if (count == 0) maior = menor = n;
        else {
            if (n > maior) maior = n;
            if (n < menor) menor = n;
        }
        soma += n;
        count++;
    }
    if (count == 0) { printf("vazio\n"); return 0; }
    printf("%.2f\n%.2f\n%.2f\n", soma/count, (double)maior, (double)menor);
    return 0;
}
