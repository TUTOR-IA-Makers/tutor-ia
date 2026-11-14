#include <stdio.h>

int main(void) {
    int n, soma = 0;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        printf("%d\n", i);
        soma += i;
    }
    printf("%d\n", soma);
    return 0;
}
