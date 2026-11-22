#include <stdio.h>

int main(void) {
    int num1, num2;
    scanf("%d %d", &num1, &num2);
    printf("%d\n", num1 + num2);
    printf("%d\n", num1 - num2);
    printf("%d\n", num1 * num2);
    printf("%d\n", num1 / num2);
    printf("%.2f\n", (float)(num1 + num2) / 2.0);
    return 0;
}
