#include <stdio.h>

int main(void) {
    int a, b, soma = 0;
    scanf("%d %d", &a, &b);
    for (int i = 0; i < b; i++) {
        soma += a;
    }
    printf("%d\n", soma);
    return 0;
}
