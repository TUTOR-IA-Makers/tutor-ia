#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        printf("%d%s", 2 * i, i == n ? "" : " ");
    }
    printf("\n");
    return 0;
}
