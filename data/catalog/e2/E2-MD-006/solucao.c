#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int meio = n / 2;
    for (int i = 0; i < n; i++) {
        int espacos = abs(meio - i);
        int ast = n - 2 * espacos;
        for (int j = 0; j < espacos; j++) printf(" ");
        for (int j = 0; j < ast; j++) printf("*");
        printf("\n");
    }
    return 0;
}
