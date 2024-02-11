import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/authentication/login_screen.dart';
import 'features/authentication/auth_provider.dart';
import 'features/home/home_screen.dart';
import 'package:go_router/go_router.dart';

void main() => runApp(FlutterPOC());

class FlutterPOC extends StatelessWidget {
  FlutterPOC({super.key});

  final _authProvider = AuthProvider();

  static const title = 'Flutter Auth';

  @override
  Widget build(BuildContext context) =>
      ChangeNotifierProvider<AuthProvider>.value(
        value: _authProvider,
        child: MaterialApp.router(
          title: title,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
            useMaterial3: true,
          ),
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        ),
      );

  late final GoRouter _router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(title: FlutterPOC.title),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(title: FlutterPOC.title),
        redirect: (context, state) {
          final AuthProvider authProvider = context.watch();
          print(authProvider.isLoggedIn);
          if (!authProvider.isLoggedIn) return '/login';
          print(authProvider.isLoggedIn);
          return null;
        },
      ),
    ],
  );
}
