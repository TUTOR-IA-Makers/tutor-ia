#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int l = 2; l <= n; l++) {
        for (int c = n + 2 - l; c <= n; c++) {
            printf("%d-%d%s", l, c, c == n ? "" : " ");
        }
        printf("\n");
    }
    return 0;
}
