#include <stdio.h>

int main(void) {
    int s;
    scanf("%d", &s);
    int hh = s / 3600;
    int mm = (s % 3600) / 60;
    int ss = s % 60;
    printf("%02d:%02d:%02d\n", hh, mm, ss);
    return 0;
}
