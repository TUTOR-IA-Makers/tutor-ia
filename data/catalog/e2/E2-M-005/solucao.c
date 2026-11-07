#include <stdio.h>

int main(void) {
    int n, soma = 0;
    scanf("%d", &n);
    for (int i = 1; i < n; i++)
        if (n % i == 0) soma += i;
    printf("%s\n", soma == n ? "perfeito" : "nao perfeito");
    return 0;
}
