default : make_js_world one.js caffeine.js dna.js gears.js inits.js large-bearing.js sortingpump.js tbv.js sphereflake.js

# OPENMP          ?=      -fopenmp

OPTFLAGS        ?=      -O3 -ffast-math -msse4.1

LDFLAGS_GL	=	$(OPENMP) -lX11 -lglut -lGL -lGLU

LDFLAGS 	=	$(OPENMP)

CXXFLAGS	+=	-Wall $(OPENMP) $(OPTFLAGS)

clean:
	rm -r sphray.new sphray.bvh glesray1 *.o ../js/*.js make_js_world

web_models: make_js_world caffeine.js sphereflake.js dna.js tbv.js inits.js one.js large-bearing.js sortingpump.js gears.js

world.o: world.h vectormath.h
sphray.bvh.o: world.h vectormath.h
sphray.bvh.o: world.h vectormath.h
glesray1.o: world.h vectormath.h
make_js_world.o: world.h vectormath.h

.cpp.o	: 
	$(CXX) -c $(CXXFLAGS) $<

sphray.new: sphray.new.o
	$(CXX) -o $@ $^ $(OPTFLAGS) $(LDFLAGS)

sphray.bvh: sphray.bvh.o world.o
	$(CXX) -o $@ $^ $(OPTFLAGS) $(LDFLAGS)

glesray1: glesray1.o world.o
	$(CXX) -o $@ $^ $(OPTFLAGS) $(LDFLAGS_GL)

make_js_world: make_js_world.o world.o
	$(CXX) -o $@ $^ $(OPTFLAGS) $(LDFLAGS)

one.js: one.ray make_js_world
	./make_js_world $^ > ../js/$@

caffeine.js: caffeine.ray make_js_world
	./make_js_world $^ > ../js/$@

sphereflake.js: sphereflake.ray make_js_world
	./make_js_world $^ > ../js/$@

dna.js: dna.ray make_js_world
	./make_js_world $^ > ../js/$@

tbv.js: tbv.ray make_js_world
	env BVH_MAX_DEPTH=10 ./make_js_world $^ > ../js/$@

large-bearing.js: large-bearing.ray make_js_world
	./make_js_world $^ > ../js/$@

sortingpump.js: sortingpump.ray make_js_world
	./make_js_world $^ > ../js/$@

inits.js: inits.ray make_js_world
	./make_js_world $^ > ../js/$@

gears.js: gears.ray make_js_world
	./make_js_world $^ > ../js/$@

one.js: one.ray make_js_world
	./make_js_world $^ > ../js/$@
