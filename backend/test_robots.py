from urllib.robotparser import RobotFileParser
rp = RobotFileParser()
rp.set_url("https://en.wikipedia.org/robots.txt")
rp.read()
print("InsydrBot:", rp.can_fetch("InsydrBot/1.0", "https://en.wikipedia.org/wiki/Virat_Kohli"))
print("*:", rp.can_fetch("*", "https://en.wikipedia.org/wiki/Virat_Kohli"))
print("Mozilla:", rp.can_fetch("Mozilla/5.0", "https://en.wikipedia.org/wiki/Virat_Kohli"))
