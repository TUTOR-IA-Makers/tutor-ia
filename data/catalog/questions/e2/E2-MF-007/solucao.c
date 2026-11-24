#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n % 3 == 0 && n % 7 == 0) {
        printf("divisivel por 3 e por 7\n");
    } else {
        printf("nao e divisivel por 3 e por 7\n");
    }
    return 0;
}
