#include <stdio.h>

int main(void) {
    int n, v, pos = 0, neg = 0, zer = 0;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v);
        if (v > 0) pos++;
        else if (v < 0) neg++;
        else zer++;
    }
    printf("%d\n%d\n%d\n", pos, neg, zer);
    return 0;
}
