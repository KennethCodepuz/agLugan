package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.GoogleTokenDTO;
import com.aglugan.backend.auth.authDTO.ResultDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth2")
public class AuthController {


    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody @Valid GoogleTokenDTO token) {

            ResultDTO result = authService.registerUserLogic(token.getIdToken());

            if(!result.isSuccess()) {
                return ResponseEntity.status(401).body(result.getErrorMessage());
            }

            System.out.println(result.getUser().getEmail());
            System.out.println(result.getUser().getId());
            System.out.println(result.getUser().getName());
            System.out.println(result.getUser().getProfilePicture());
            System.out.println(result.getUser().getRole());

            return ResponseEntity.ok(result.getUser());

    }

}
