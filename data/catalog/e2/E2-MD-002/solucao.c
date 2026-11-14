#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int l = 1; l < n; l++) {
        for (int c = l + 1; c <= n; c++) {
            printf("%d-%d%s", l, c, c == n ? "" : " ");
        }
        printf("\n");
    }
    return 0;
}
