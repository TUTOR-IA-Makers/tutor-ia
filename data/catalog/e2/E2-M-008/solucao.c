#include <stdio.h>

int main(void) {
    long long a1, a2, termo;
    int n;
    scanf("%lld %lld %d", &a1, &a2, &n);
    printf("%lld %lld", a1, a2);
    for (int i = 3; i <= n; i++) {
        if (i % 2 == 0) termo = a2 - a1;
        else termo = a2 + a1;
        printf(" %lld", termo);
        a1 = a2;
        a2 = termo;
    }
    printf("\n");
    return 0;
}
