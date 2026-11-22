#include <stdio.h>
#include <math.h>

int main(void) {
    double pr1, pr2, mf;
    scanf("%lf %lf", &pr1, &pr2);
    mf = (pr1 + pr2) / 2.0;
    printf("%d\n", (int)(mf + 1e-9));
    printf("%d\n", (int)round(mf + 1e-9));
    return 0;
}
