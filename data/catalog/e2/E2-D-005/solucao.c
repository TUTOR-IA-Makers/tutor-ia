#include <stdio.h>

int main(void) {
    int base, expo;
    scanf("%d %d", &base, &expo);
    if (base >= 2 && expo > 1) {
        long long pot = 1;
        for (int i = 1; i <= expo; i++) {
            pot *= base;
        }
        printf("%lld\n", pot);
    } else {
        printf("Nao satisfazem\n");
    }
    return 0;
}
