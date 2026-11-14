#include <stdio.h>

int main(void) {
    int a, b, soma;
    scanf("%d %d", &a, &b);
    soma = a + b;
    if (soma > 10) {
        printf("%d\n", soma);
    }
    return 0;
}
