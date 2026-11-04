#include <stdio.h>

int main(void) {
    int n, soma = 0;
    scanf("%d", &n);
    while (n != 0) {
        soma += n;
        scanf("%d", &n);
    }
    printf("%d\n", soma);
    return 0;
}
