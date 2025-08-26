# 이것들을 람다로 바꿔보세요!
def triple(x):
    return x * 3

def is_even(x):
    return x % 2 == 0

def square(x):
    return x * x

# 여기에 람다 버전들을 작성해보세요
triple_lambda = lambda x: x * 3
is_even_lambda = lambda x: x % 2 == 0
square_lambda = lambda x: x * x

# 테스트
print("3 * 3 =", triple_lambda(3))
print("4는 짝수인가?", is_even_lambda(4))
print("5의 제곱 =", square_lambda(5))


# 이런 람다들을 직접 만들어보세요
# 1. 10보다 큰지 확인하는 함수
over_10 = lambda x: x > 10

# 2. 두 배로 만드는 함수  
double = lambda x: x * 2

# 3. 음수인지 확인하는 함수
is_negative = lambda x: x < 0

# 테스트해보세요
numbers = [15, 5, -3, 8, 12]
print("15는 10보다 큰가?", over_10(15))
print("7의 두 배는?", double(7))
print("-3은 음수인가?", is_negative(-3))



numbers = [-5, 2, 8, 15, -2, 12, 1]

# 여러분의 람다들을 사용해보세요!
doubled = lambda x: x * 2
big_numbers = lambda x: x > 10
negatives = lambda x: x < 0

doubled = list(map(doubled, numbers))
big_numbers = list(filter(big_numbers, numbers))  
negatives = list(filter(negatives, numbers))

print("모든 수를 두 배로:", doubled)
print("10보다 큰 수들:", big_numbers)
print("음수들:", negatives)

result = list(map(lambda x: x*2, numbers))
print(result)