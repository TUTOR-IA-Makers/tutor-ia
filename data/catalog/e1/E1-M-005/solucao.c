#include <stdio.h>

int main(void) {
    double l, w, h;
    scanf("%lf %lf %lf", &l, &w, &h);
    printf("%.2f\n", l * w * h);
    printf("%.2f\n", 2.0 * (l*w + l*h + w*h));
    return 0;
}
