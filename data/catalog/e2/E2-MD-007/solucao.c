#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    long long c = 1;
    for (int i = 1; i <= n + 1; i++) {
        printf("%lld", c);
        if (i <= n) printf(" ");
        c = c * (n - i + 1) / i;
    }
    printf("\n");
    return 0;
}
