#include <stdio.h>

int main(void) {
    int n, soma = 0;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        int maior = a >= b ? a : b;
        printf("%d\n", maior);
        soma += maior;
    }
    printf("%d\n", soma);
    return 0;
}
