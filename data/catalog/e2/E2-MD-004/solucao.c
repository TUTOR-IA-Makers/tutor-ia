#include <stdio.h>

int main(void) {
    int n, primeiro = 1;
    scanf("%d", &n);
    for (int i = 2; i <= n; i++) {
        while (n % i == 0) {
            if (!primeiro) printf(" * ");
            printf("%d", i);
            primeiro = 0;
            n /= i;
        }
    }
    printf("\n");
    return 0;
}
