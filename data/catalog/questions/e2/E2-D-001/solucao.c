#include <stdio.h>

int main(void) {
    int l, u, k, primeiro = 1;
    scanf("%d %d %d", &l, &u, &k);
    int ini = l + (k - ((l % k + k) % k));
    for (int i = ini; i < u; i += k) {
        if (!primeiro) printf(" ");
        printf("%d", i);
        primeiro = 0;
    }
    printf("\n");
    return 0;
}
