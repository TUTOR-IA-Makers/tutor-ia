#include <stdio.h>
#include <math.h>

int main(void) {
    int termo, razao, quinto;
    scanf("%d %d", &termo, &razao);
    quinto = termo * (int)round(pow(razao, 4));
    printf("%d\n", quinto);
    return 0;
}
