#20250825
def can_ride_attraction(height):
    return height >= 130
    # 키가 130 이상이면 True, 아니면 False를 반환

people_heights = [120, 140, 110, 150, 125]
result = filter(can_ride_attraction, people_heights)


print(list(result))