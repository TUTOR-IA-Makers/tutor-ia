#include <stdio.h>

int main(void) {
    double c;
    scanf("%lf", &c);
    double f = (9.0 * c + 160.0) / 5.0;
    printf("%.2f\n", f);
    return 0;
}
