#include <stdio.h>

int main(void) {
    long long a1, a2, termo, soma;
    int n;
    scanf("%lld %lld %d", &a1, &a2, &n);
    soma = a1 + a2;
    printf("%lld %lld", a1, a2);
    for (int i = 3; i <= n; i++) {
        termo = a1 + a2;
        printf(" %lld", termo);
        soma += termo;
        a1 = a2;
        a2 = termo;
    }
    printf("\n%lld\n", soma);
    return 0;
}
